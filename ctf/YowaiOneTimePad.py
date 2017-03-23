#!/usr/bin/env python

#################################################################
# <���傤����OneTimePad>
#
# ����ȃR�[�h���Ȃ��ł������Ƃ������ق����ǂ��Ǝv���܂�
#   https://twitter.com/elliptic_shiho/status/843664286215897088
#################################################################
# ���z�F
#   tmp��257�r�b�g�ڂ�1�̂Ƃ�tmp�̉�����6�r�b�g�ڂ����]����B
#   res=res^P �����s�����Ȃ����res�̋����Ԗڂ̃r�b�g�͂��ׂ�0�ɂȂ�i���ۂ��j�B
#   �����ŋ����r�b�g��1�̂Ƃ�����P�Ƃ�XOR�������257�r�b�g�ڂ���𕜌�����B
#   ������for���[�v�̍Ō��10�񂭂炢��res=res^P��1�ɂȂ��������r�b�g��
#   257�r�b�g�ڂ܂łĂ��Ă悭������Ȃ��Ȃ�̂ŁA���̍Ō��10�񕪂��炢��
#   �S�T�����čŏI�I�ɋ����Ԗڂ̃r�b�g�����ׂ�0�ɂȂ邩�ǂ����Ŕ��肷��B
#################################################################

from os import urandom

def process(m, k):
    tmp = m ^ k
    res = 0
    for i in bin(tmp)[2:]:
        res = res << 1;
        if (int(i)):
            res = res ^ tmp
        if (res >> (256)):
            res = res ^ P
    return res

def keygen(seed):
    key = str2num(urandom(32))
    while True:
        yield key
        key = process(key, seed)

def str2num(s):
    return int(s.encode('hex'), 16)

P = 0x10000000000000000000000000000000000000000000000000000000000000425L

true_secret =  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
fake_secret1 = "I_am_not_a_secret_so_you_know_me"
fake_secret2 = "feeddeadbeefcafefeeddeadbeefcafe"

#################################################################

code1 = "af3fcc28377e7e983355096fd4f635856df82bbab61d2c50892d9ee5d913a07f"
code2 = "630eb4dce274d29a16f86940f2f35253477665949170ed9e8c9e828794b5543c"
code3 = "e913db07cbe4f433c7cdeaac549757d23651ebdccf69d7fbdfd5dc2829334d1b"

extra_work = 10  # �S�T���͈�

# process(m,k) �̒l���猳�� m^k �̒l�𐄑�����isqrt�炵���j
def search_mk(val1):
  ret_value = 0

  for n in range(1 << extra_work):  # �S�T���p�[�g
    P2 = P
    val = val1
    
    for j in range(256):
      # a�̐�������Ȃ������i������ƃC�P�ĂȂ��j
      if(val & (P2 & 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa) and ((j & 1) == 0)):
        val = val ^ P2
      for k in range(extra_work):
        if((n & (1 << k)) == 0 and j == k):
          val = val ^ P2
      P2 = P2 * 2L
  
    val_even = int(bin(val)[2:][1::2], 2)
      
    if val_even == 0:
      val_odd = int(bin(val)[2:][0::2], 2)
      
      if (val_odd >> 256) == 0:
        print "val_odd found!: {%s}" % (hex(val_odd))
        ret_value = val_odd

  return ret_value

#################################################################

rand_2 = str2num(fake_secret2) ^ int(code3,16)
rand_1 = str2num(fake_secret1) ^ int(code2,16)

print "search 1:"
tmp_1 = search_mk(rand_2)
print "tmp_1: {%s}" % hex(tmp_1)
# tmp_1:  0x6d7d7e2073aed753412fbcb6fb38cc5826417711d111edca20a341631e0a5249L

print "search 2:"
tmp_0 = search_mk(rand_1)
print "tmp_0: {%s}" % hex(tmp_0)
# tmp_0:  0x9c2338fbca9566115587eca7e73bb7db2df7220f98761c1f1f18001d1192b936L

seed_recovered = rand_1 ^ tmp_1
print "seed: {%s}" % hex(seed_recovered)
# seed: 0x472cab91ceb46abd08b68a856ca8ec6e156861ea1f186f21f356ad8bfde06b10L

rand_0 = seed_recovered ^ tmp_0
plain_text = rand_0 ^ int(code1,16)
print "plain_text: {%s}" % hex(plain_text)
# plain_text: 0x74305f42335f72346e646f4d5f656e305567685f31735f6e6563337335617259L

print
print 'flag{%s}' % hex(plain_text)[2:-1].decode('hex')
# flag{t0_B3_r4ndoM_en0Ugh_1s_nec3s5arY}

